import pytest

from src.handler import handler


@pytest.fixture()
def event():
    return {"date": "2024-01-01"}


@pytest.fixture()
def context():
    return


def test_handler(event, context, caplog):
    handler(event, context)
    assert "Date: 2024-01-01" in caplog.text
