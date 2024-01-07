import pytest
from airflow.models import DagBag


@pytest.fixture()
def dagbag():
    return DagBag(dag_folder="dags", include_examples=False)


@pytest.fixture()
def dag(dagbag):
    return dagbag.get_dag(dag_id="lambda_dag")


def test_dag_loaded(dagbag, dag):
    assert dagbag.import_errors == {}
    assert dag is not None
    assert len(dag.tasks) == 1


def test_dag(dag):
    source = {"lambda_task": []}
    assert dag.task_dict.keys() == source.keys()
    for task_id, downstream_list in source.items():
        assert dag.has_task(task_id)
        task = dag.get_task(task_id)
        assert task.downstream_task_ids == set(downstream_list)
