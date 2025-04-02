import { App, assertions } from "aws-cdk-lib";
import { expect, test } from "vitest";
import { DagStack } from "../lib/dag-stack";
import { MwaaStack } from "../lib/mwaa-stack";

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

  // Remove hashes from snapshot
  const bucketDeployment = template.findResources(
    "Custom::CDKBucketDeployment",
  );
  for (const key of Object.keys(bucketDeployment)) {
    bucketDeployment[key].Properties.SourceObjectKeys = ["removed-hash"];
  }
  const lambdaFunctions = template.findResources("AWS::Lambda::Function");
  for (const key of Object.keys(lambdaFunctions)) {
    lambdaFunctions[key].Properties.Code.S3Key = "removed-hash";
  }

  expect(template.toJSON()).toMatchSnapshot();
});
