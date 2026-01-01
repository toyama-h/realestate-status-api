export type StatusLiteral = 'AVAILABLE' | 'GUIDING' | 'CONTRACTED';

// FastAPIの /rooms エンドポイントから取得する部屋オブジェクトの型
export interface Room {
    id: string;
    name: string;
    address: string;
    status: StatusLiteral;
}

// WebSocketで受信するメッセージの型
export interface RoomUpdateMessage {
    type: "ROOM_STATUS_UPDATE";
    room_id: string;
    new_status: StatusLiteral;
}