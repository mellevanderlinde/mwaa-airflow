import { App, assertions } from "aws-cdk-lib";
import { MwaaAirflowStack } from "../lib/mwaa-airflow-stack";

test("Match with snapshot", () => {
  const app = new App();
  const stack = new MwaaAirflowStack(app, "TestMwaaAirflowStack");
  const template = assertions.Template.fromStack(stack);
  expect(template.toJSON()).toMatchSnapshot();
});
