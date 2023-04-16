import * as cdk from "aws-cdk-lib";
import {
  aws_appsync as appsync,
  aws_lambda as lambda,
  aws_s3 as s3,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import * as path from "path";

export class S3PresignCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new s3.Bucket(this, "S3PresignCdkBucket", {
      autoDeleteObjects: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
            s3.HttpMethods.DELETE,
          ],
          allowedOrigins: ["*"],
          allowedHeaders: ["*"],
        },
      ],
      publicReadAccess: true,
      lifecycleRules: [
        {
          expiration: cdk.Duration.days(1),
        },
      ],
    });

    const authorizerLambda = new lambda.Function(
      this,
      "S3PresignCdkAuthorizerLambda",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: "index.handler",
        memorySize: 128,
        architecture: lambda.Architecture.ARM_64,
        timeout: cdk.Duration.seconds(10),
        code: lambda.Code.fromAsset(
          path.join(__dirname, "..", "lambdas", "authorizer")
        ),
      }
    );

    const graphqlApi = new appsync.GraphqlApi(this, "S3PresignCdkApi", {
      name: "s3-presign-cdk-api",
      schema: appsync.SchemaFile.fromAsset("graphql/schema.graphql"),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.LAMBDA,
          lambdaAuthorizerConfig: {
            handler: authorizerLambda,
          },
        },
      },
    });

    const s3PresignLambda = new lambda.Function(this, "S3PresignLambda", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "index.handler",
      memorySize: 128,
      architecture: lambda.Architecture.ARM_64,
      timeout: cdk.Duration.seconds(10),
      code: lambda.Code.fromAsset(
        path.join(__dirname, "..", "lambdas", "presign")
      ),
      environment: {
        BUCKET_NAME: bucket.bucketName,
      },
    });

    bucket.grantPut(s3PresignLambda);

    const presignLambdaDS = graphqlApi.addLambdaDataSource(
      "S3PresignLambdaDS",
      s3PresignLambda
    );

    presignLambdaDS.createResolver("presignResolver", {
      typeName: "Mutation",
      fieldName: "presign",
    });

    new cdk.CfnOutput(this, "GraphQLAPIURL", {
      value: graphqlApi.graphqlUrl,
    });
  }
}
