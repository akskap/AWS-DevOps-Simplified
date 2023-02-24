import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Vpc, SubnetType, SecurityGroup, Port, Peer } from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as efs from 'aws-cdk-lib/aws-efs';
import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns';
import { setUncaughtExceptionCaptureCallback } from 'process';
import { Ec2Action } from 'aws-cdk-lib/aws-cloudwatch-actions';

export class Chapter7Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const mountPath = "/data/db"
    const volumeName = "dbvolume"
    const customVPC = new Vpc(this, 'CustomVPC', {
      cidr: '10.0.0.0/16',
      maxAzs: 2,
      subnetConfiguration: [
        {
          subnetType: SubnetType.PRIVATE_WITH_EGRESS,
          name: 'privateSubnet',
          cidrMask: 24,
        },
        {
          subnetType: SubnetType.PUBLIC,
          name: 'publicSubnet',
          cidrMask: 24,
        }
      ],
      natGateways: 2
    })

    const ecsCluster = new ecs.Cluster(this, 'ECSCluster', {
      vpc: customVPC,
      clusterName: "aws-devops-simplified",
    })

    const executionRolePolicy =  new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      resources: ['*'],
      actions: [
                "ecr:GetAuthorizationToken",
                "ecr:BatchCheckLayerAvailability",
                "ecr:GetDownloadUrlForLayer",
                "ecr:BatchGetImage",
                "logs:CreateLogStream",
                "logs:PutLogEvents",
                "logs:*",
                "elasticfilesystem:*"
            ]
    });
    const fargateTaskDefn = new ecs.FargateTaskDefinition(this, "FargateTaskDefn", {
      cpu: 4096,
      memoryLimitMiB: 8192,
    });
    fargateTaskDefn.addToExecutionRolePolicy(executionRolePolicy);
    fargateTaskDefn.addToTaskRolePolicy(executionRolePolicy);

    const appContainer = new ecs.ContainerDefinition(this, "AppContainerDefn", {
      image: ecs.ContainerImage.fromRegistry("akskap/flask-todo-list-app"),
      taskDefinition: fargateTaskDefn,
      cpu: 512,
      memoryLimitMiB: 1024,
      logging: ecs.LogDrivers.awsLogs({streamPrefix: "aws-devops-simplified-app-container"})
    })
    appContainer.addPortMappings({
      containerPort: 5000
    })

    const dbContainer = new ecs.ContainerDefinition(this, "DBContainerDefn", {
      image: ecs.ContainerImage.fromRegistry("mongo"),
      taskDefinition: fargateTaskDefn,
      cpu: 512,
      memoryLimitMiB: 1024,
      logging: ecs.LogDrivers.awsLogs({streamPrefix: "aws-devops-simplified-db-container"})
    })
    dbContainer.addMountPoints({
      containerPath: mountPath,
      sourceVolume: volumeName,
      readOnly: false,
    })

    const efsSecurityGroup = new SecurityGroup(this, "EFSSecurityGroup", {
      allowAllOutbound: true,
      vpc:customVPC,
      description: "Security Group for the EFS File System"
    })
    efsSecurityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(2049));
    
    const fileSystem = new efs.FileSystem(this, "FileSystem", {
      vpc: customVPC,
      securityGroup: efsSecurityGroup,
    })

    const efsVolume = {
      name: volumeName,
      efsVolumeConfiguration: {
        fileSystemId: fileSystem.fileSystemId
      }
    }

    fargateTaskDefn.addVolume(efsVolume);

    const fargateService = new ecs_patterns.ApplicationLoadBalancedFargateService(this, "FargateService", {
      cluster: ecsCluster,
      taskDefinition: fargateTaskDefn,
    })
  }
}
