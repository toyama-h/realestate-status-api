//仲介業者側のUI

import React, { useState, useEffect } from 'react';
import　type { Room, RoomUpdateMessage, StatusLiteral } from './types.js';

const API_URL = "http://localhost:8000";
const WS_URL = "ws://localhost:8000/ws/rooms/status";

// --- ステータスを英語から日本語に変換するマップ ---
const STATUS_MAP: Record<StatusLiteral, string> = {
    'AVAILABLE': '募集中',
    'GUIDING': '案内中',
    'CONTRACTED': '成約済み',
};

// 部屋の状態表示を行うコンポーネント
const RoomList: React.FC = () => {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    // 新しいステータスに基づいて色を決定する関数
    const getStatusStyle = (status: StatusLiteral) => {
        switch (status) {
            case 'AVAILABLE':
                return { color: 'blue', backgroundColor: "#b5c5fcff" };
            case 'GUIDING':
                return { color: 'green', backgroundColor: '#aaf0c1ff' };
            case 'CONTRACTED':
                return { color: 'red', backgroundColor: '#f5bfc7ff' };
            default:
                // 未定義のステータスが来た場合
                return { color: 'gray', backgroundColor: '#f0f0f0' };
        }
    };


    // --- 初期データを取得する処理  ---
    useEffect(() => {
        const fetchRooms = async () => {
            try {
                const response = await fetch(`${API_URL}/rooms`);
                if (!response.ok) {
                    throw new Error('初期データの取得に失敗しました。');
                }
                const data: Room[] = await response.json();
                setRooms(data);
            } catch (error) {
                console.error("初期データ取得エラー:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchRooms();
    }, []);

    // --- WebSocket  ---
    useEffect(() => {
        const socket = new WebSocket(WS_URL);

        socket.onopen = () => console.log("WebSocket 接続確立。リアルタイム更新を開始します。");
        socket.onclose = () => console.log("WebSocket 接続が閉じられました。");
        socket.onerror = (error) => console.error("WebSocket エラー:", error);

        socket.onmessage = (event) => {
            const message: RoomUpdateMessage = JSON.parse(event.data);
            if (message.type === "ROOM_STATUS_UPDATE") {
                setRooms(prevRooms => {
                    return prevRooms.map(room => {
                        if (room.id === message.room_id) {
                            return { ...room, status: message.new_status };
                        }
                        return room;
                    });
                });
            }
        };
        return () => {
            socket.close();
        };
    }, []);

    if (loading) return <p>ロード中...</p>;

    return (
        <div style={{ padding: '20px', maxWidth: '600px', margin: 'auto' }}>
            <h1>仲介業者 UI</h1>
            {rooms.length === 0 ? (
                <p>部屋データが見つかりません。</p>
            ) : (
                rooms.map((room) => {
                    const { color, backgroundColor } = getStatusStyle(room.status);

                    return (
                        <div key={room.id} style={{
                            padding: '15px',
                            margin: '10px 0',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            backgroundColor: backgroundColor
                        }}>
                            <h3>{room.name}</h3>
                            <p style={{
                                fontWeight: 'bold',
                                color: color
                            }}>
                                ステータス: {STATUS_MAP[room.status]}
                            </p>
                        </div>
                    );
                })
            )}
        </div>
    );
};

export default RoomList;