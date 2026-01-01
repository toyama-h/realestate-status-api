import React, { useEffect, useState } from 'react';
import type { Room } from './types.js';

const AdminPanel = () => {
    const [rooms, setRooms] = useState<Room[]>([]);

    useEffect(() => {
        const fetchRooms = async () => {
            try {
                const res = await fetch("http://localhost:8000/rooms");
                const data = await res.json();
                if (Array.isArray(data)) {
                    setRooms(data);
                } else {
                    console.error("roomsデータが配列ではありません:", data);
                }
            } catch (e) {
                console.error("roomsデータの取得に失敗:", e);
            }
        };
        fetchRooms();

        const socket = new WebSocket('ws://localhost:8000/ws/rooms/status');
        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (Array.isArray(data)) {
                    setRooms(data);
                } else if (data && data.type === "ROOM_STATUS_UPDATE" && data.room_id && data.new_status) {
                    setRooms((prevRooms) => prevRooms.map(room =>
                        room.id === data.room_id ? { ...room, status: data.new_status } : room
                    ));
                } else {
                    console.error("roomsデータが配列でもROOM_STATUS_UPDATEでもありません:", data);
                }
            } catch (e) {
                console.error("roomsデータのパースに失敗:", e);
            }
        };
        return () => socket.close();
    }, []);

    const updateStatus = async (id: string, newStatus: string) => {
        const res = await fetch(`http://localhost:8000/rooms/${id}/status`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ new_status: newStatus }),
        });
        const result = await res.json();
        if (result && result.room && result.room.id && result.room.status) {
            setRooms((prevRooms) => prevRooms.map(room =>
                room.id === result.room.id ? { ...room, status: result.room.status } : room
            ));
        } else {
            const res = await fetch("http://localhost:8000/rooms");
            const rooms = await res.json();
            setRooms(rooms);
        }
    };

    const getStatusLabel = (status: string) => {
    if (status === "AVAILABLE") return "募集中";
    if (status === "GUIDING") return "案内中";
    return "成約済";
    };

    return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
        <h1>管理会社 UI</h1>
        <div style={{ display: 'grid', gap: '15px' }}>
        {rooms.map((room) => (
            <div key={room.id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
            <div style={{ marginBottom: '10px' }}>
                <strong style={{ fontSize: '1.2em' }}>{room.name}</strong>
            </div>
            <div style={{ marginBottom: '10px' }}>
                状態: <span style={{
                padding: '2px 8px',
                borderRadius: '4px',
                background: room.status === "AVAILABLE" ? "#85a1fdff" : room.status === "GUIDING" ? "#6fb687ff" : "#f5bfc7ff" 
                }}>
                {getStatusLabel(room.status)}
                </span>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => updateStatus(room.id, "AVAILABLE")}>募集中</button>
                <button onClick={() => updateStatus(room.id, "GUIDING")}>案内中</button>
                <button onClick={() => updateStatus(room.id, "CONTRACTED")}>成約済</button>
            </div>
            </div>
        ))}
        </div>
    </div>
    );
};

export default AdminPanel;