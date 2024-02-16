import { App, assertions } from "aws-cdk-lib";
import { MwaaStack } from "../lib/mwaa-stack";
import { DagStack } from "../lib/dag-stack";

test("Match MwaaStack with snapshot", () => {
  const app = new App();
  const stack = new MwaaStack(app, "TestMwaaStack");
  const template = assertions.Template.fromStack(stack);
  expect(template.toJSON()).toMatchSnapshot();
});

test("Match DagStack with snapshot", () => {
  const app = new App();
  const stack = new DagStack(app, "TestDagStack", {
    bucketName: "test-bucket",
    dagFolder: "test-folder",
    roleName: "test-role",
  });
  const template = assertions.Template.fromStack(stack);
  expect(template.toJSON()).toMatchSnapshot();
});
