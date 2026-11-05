from __future__ import annotations

import atexit
import os
import tempfile
from pathlib import Path

_test_database_directory = tempfile.TemporaryDirectory(prefix='autonyx-api-tests-')
_test_database_path = Path(_test_database_directory.name) / 'test.db'
os.environ['DATABASE_URL'] = f'sqlite:///{_test_database_path.as_posix()}'

from app.db.base import Base
from app.db.session import get_engine

Base.metadata.create_all(get_engine())
atexit.register(get_engine().dispose)
