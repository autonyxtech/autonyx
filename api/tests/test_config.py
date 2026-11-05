from pathlib import Path

from app.core.config import API_ENV_FILE, Settings


def test_settings_load_env_file_from_api_directory_regardless_of_working_directory(
    monkeypatch, tmp_path: Path
) -> None:
    monkeypatch.chdir(tmp_path)

    assert Settings.model_config['env_file'] == API_ENV_FILE
    assert API_ENV_FILE.name == '.env'
    assert API_ENV_FILE.parent.name == 'api'
