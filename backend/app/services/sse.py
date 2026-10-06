import asyncio
from typing import AsyncGenerator

# Connected dashboard clients
_clients: list[asyncio.Queue] = []

async def event_generator() -> AsyncGenerator[str, None]:
    """
    Yields SSE-formatted strings to a connected client.
    """
    queue: asyncio.Queue = asyncio.Queue()
    _clients.append(queue)

    try:
        # Send initial connection confirmation
        yield "event: connected\ndata: {\"status\": \"connected\"}\n\n"

        while True:
            try:
                data = await asyncio.wait_for(queue.get(), timeout=30.0)
                yield f"event: report_update\ndata: {data}\n\n"
            except asyncio.TimeoutError:
                # Keep-alive ping every 30 seconds
                yield ": keep-alive\n\n"
    finally:
        _clients.remove(queue)

async def broadcast(message: str):
    """
    Sends a message to all connected dashboard clients.
    """
    for queue in _clients:
        await queue.put(message)