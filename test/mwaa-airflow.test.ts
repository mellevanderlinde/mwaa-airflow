import { App, assertions } from "aws-cdk-lib";
import { MwaaAirflowStack } from "../lib/mwaa-airflow-stack";
import { DagAirflowStack } from "../lib/dag-airflow-stack";

test("Match MwaaAirflowStack with snapshot", () => {
  const app = new App();
  const stack = new MwaaAirflowStack(app, "TestMwaaAirflowStack");
  const template = assertions.Template.fromStack(stack);
  expect(template.toJSON()).toMatchSnapshot();
});

test("Match DagAirflowStack with snapshot", () => {
  const app = new App();
  const stack = new DagAirflowStack(app, "TestDagAirflowStack", {
    bucketName: "test-bucket",
    dagFolder: "test-folder",
    roleName: "test-role",
  });
  const template = assertions.Template.fromStack(stack);
  expect(template.toJSON()).toMatchSnapshot();
});
