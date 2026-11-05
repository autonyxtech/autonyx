from app.agents.memory.store import ChatMemoryStore


def test_memory_keeps_recent_complete_turns() -> None:
    memory = ChatMemoryStore(max_messages=4)
    for index in range(3):
        memory.add_turn('session', f'question {index}', f'answer {index}')

    assert memory.get_history('session') == [
        {'role': 'user', 'content': 'question 1'},
        {'role': 'assistant', 'content': 'answer 1'},
        {'role': 'user', 'content': 'question 2'},
        {'role': 'assistant', 'content': 'answer 2'},
    ]


def test_memory_returns_copies_and_expires_sessions(monkeypatch) -> None:
    times = iter([10.0, 10.0, 10.0, 12.0])
    monkeypatch.setattr('app.agents.memory.store.time.monotonic', lambda: next(times))
    memory = ChatMemoryStore(ttl_seconds=1)
    memory.add_turn('session', 'hello', 'hi')

    history = memory.get_history('session')
    history.clear()
    assert len(memory.get_history('session')) == 2
    assert memory.get_history('session') == []
