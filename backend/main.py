from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn
import uuid
from typing import Dict, List, Literal
from fastapi.middleware.cors import CORSMiddleware
from fastapi import WebSocket, WebSocketDisconnect
# ---初期設定 ---
app = FastAPI(title="Real Estate Status API")

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- データの定義  ---

RoomStatus = Literal["AVAILABLE", "GUIDING", "CONTRACTED"]

class Room(BaseModel):
    id: str
    name: str
    address: str
    status: RoomStatus

class StatusUpdate(BaseModel):
    new_status: RoomStatus

# --- 仮のデータストア ---

ROOMS: Dict[str, Room] = {}
for name, address, status in [
    ("清水寺マンション 201号室", "京都市東山区", "AVAILABLE"),
    ("比叡山ハイツ 503号室", "京都市左京区", "GUIDING"),
    ("メゾン京都駅前 101号室", "京都府下京区", "CONTRACTED"),
]:
    room_id = str(uuid.uuid4())
    ROOMS[room_id] = Room(
        id=room_id,
        name=name,
        address=address,
        status=status
    )
# --- WebSocket 接続マネージャー ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"新しい WebSocket 接続が確立されました。合計: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        print(f"WebSocket 接続が終了しました。合計: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except RuntimeError:
                pass

manager = ConnectionManager()


# --- API エンドポイント ---
@app.websocket("/ws/rooms/status")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            print(f"クライアントからメッセージを受信: {data}")

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"WebSocket エラー: {e}")

@app.get("/rooms", response_model=List[Room])
def get_all_rooms():
    """
    全ての部屋のリストを取得するエンドポイント (仲介業者側が使う)
    """
    return list(ROOMS.values())

@app.post("/rooms/{room_id}/status")
async def update_room_status(room_id: str, update: StatusUpdate):
    """
    特定の部屋のステータスを更新し、WebSocketで変更をブロードキャストする
    """
    if room_id not in ROOMS:
        raise HTTPException(status_code=404, detail=f"Room with ID {room_id} not found")

    ROOMS[room_id].status = update.new_status
    updated_room = ROOMS[room_id]

    update_message = {
        "type": "ROOM_STATUS_UPDATE",
        "room_id": updated_room.id,
        "new_status": updated_room.status
    }

    await manager.broadcast(update_message)
    print(f"ステータス更新: 部屋ID {room_id} が {update.new_status} に変更されました。ブロードキャスト完了。")
    return {"message": "Status updated successfully", "room": updated_room}

# ---サーバー実行関連 ---
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)