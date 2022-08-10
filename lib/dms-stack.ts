// import * as cdk from '@aws-cdk/core';
import * as cdk from 'aws-cdk-lib';
import { App, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dms from 'aws-cdk-lib/aws-dms';
import { aws_rds as rds,  } from  'aws-cdk-lib';
import { 
  ManagedPolicy, 
  Role, 
  ServicePrincipal, 
  PolicyStatement, 
  Effect 
} from 'aws-cdk-lib/aws-iam';
import * as iam from 'aws-cdk-lib/aws-iam';
// import * as iam from 'aws-cdk-lib/aws-iam';
import { aws_ec2 as ec2  } from  'aws-cdk-lib';
import { aws_s3 as s3 } from 'aws-cdk-lib';
import { aws_dynamodb as dynamodb } from  'aws-cdk-lib';
import { Vpc as vpc } from 'aws-cdk-lib/aws-ec2';
import * as glue from 'aws-cdk-lib/aws-glue';
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";


export class DmsStack extends Stack {
   constructor(scope: Construct, id: string, props?: StackProps) {
    role: Role;
    super(scope, id, props);

    const vpc = ec2.Vpc.fromLookup(this, 'default', {
      isDefault: true
    });

   // use the Bucket construct
      const s3RawData = new s3.Bucket(this, 'raw-data-bucket', {
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      });
  
      //DynamoBD
      const dynamotable = new dynamodb.Table(this, 'DynamoTable-db', {
        partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      });

    
    const dmsVPCServiceRole = new Role(this, 'dms-vpc-role', {
      assumedBy: new ServicePrincipal('dms.amazonaws.com'),
      roleName: 'dms-vpc-role'
    });

     //  create RDS instance
     const dbInstance = new rds.DatabaseInstance(this, 'db-instance', {
        vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PUBLIC,
        },
        engine: rds.DatabaseInstanceEngine.postgres({
          version: rds.PostgresEngineVersion.VER_14_2,
        }),
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.BURSTABLE3,
          ec2.InstanceSize.MICRO,
        ),
        credentials: rds.Credentials.fromGeneratedSecret('postgres'),
        multiAz: false,
        allocatedStorage: 100,
        maxAllocatedStorage: 105,
        allowMajorVersionUpgrade: false,
        autoMinorVersionUpgrade: true,
        backupRetention: cdk.Duration.days(0),
        deleteAutomatedBackups: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        deletionProtection: false,
        databaseName: 'dotdata',
        publiclyAccessible: false,
      });
  
      // dbInstance.connections.allowFrom(ec2Instance, ec2.Port.tcp(5432));
      dbInstance.connections.allowDefaultPortInternally;
  
      new cdk.CfnOutput(this, 'dbEndpoint', {
        value: dbInstance.instanceEndpoint.hostname,
      });
  
      
  
      new cdk.CfnOutput(this, 'secretName', {
        // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
        value: dbInstance.secret?.secretName!,
      });
  
  
      // SOURCE ENDPOINT FOR dms
      const Postgre_target =  new cdk.CfnOutput(this, 'dbEndpoint1', {
        value: dbInstance.instanceEndpoint.hostname,
      });
  

    // Add a policy to a Role
    dmsVPCServiceRole.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        resources: ['*'],
        actions: [            
          'sts:AssumeRole',
         ]
      })
    );

    dmsVPCServiceRole.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        resources: ['*'],
        actions: [            
          'dms:*',
        ]
      })
    );

    dmsVPCServiceRole.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        resources: ['*'],
        actions: [            
          "kms:ListAliases", 
          "kms:DescribeKey"
        ]
      })
    );

    dmsVPCServiceRole.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        resources: ['*'],
        actions: [            
          "iam:GetRole",
          "iam:PassRole",
          "iam:CreateRole",
          "iam:AttachRolePolicy"
        ]
      })
    );


    dmsVPCServiceRole.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        resources: ['*'],
        actions: [            
          "dynamodb:PutItem",
          "dynamodb:CreateTable",
          "dynamodb:DescribeTable",
          "dynamodb:DeleteTable",
          "dynamodb:DeleteItem",
          "dynamodb:UpdateItem"
        ]
      })
    );

    dmsVPCServiceRole.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        resources: ['*'],
        actions: [            
          "dynamodb:ListTables"
        ]
      })
    );
   
    dmsVPCServiceRole.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        resources: ['*'],
        actions: [       
          "ec2:CreateVpc", 
          "ec2:CreateSubnet",      
          "ec2:DescribeVpcs",
          "ec2:DescribeInternetGateways",
          "ec2:DescribeAvailabilityZones",
          "ec2:DescribeSubnets",
          "ec2:DescribeSecurityGroups",
          "ec2:ModifyNetworkInterfaceAttribute",
          "ec2:CreateNetworkInterface",
          "ec2:DeleteNetworkInterface"
        ]
      })
    );


    dmsVPCServiceRole.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        resources: ['*'],
        actions: [            
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams",
          "logs:FilterLogEvents",
          "logs:GetLogEvents"
        ]
      })
    );

    dmsVPCServiceRole.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        resources: [`arn:aws:s3:::${s3RawData.bucketName}/*`],
        actions: [            
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:PutObjectTagging"
        ]
      })
    );

    dmsVPCServiceRole.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        resources: [`arn:aws:s3:::${s3RawData.bucketName}`],
        actions: [            
          "s3:ListBucket"
        ]
      })
    );

    dmsVPCServiceRole.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        resources: [`arn:aws:s3:::${s3RawData.bucketName}`],
        actions: [            
          "s3:GetBucketLocation"
        ]
      })
    );

    const dmsVpcManagementRolePolicy = ManagedPolicy.fromManagedPolicyArn(
      this, 
      'AmazonDMSVPCManagementRole', 
      'arn:aws:iam::aws:policy/service-role/AmazonDMSVPCManagementRole'
    );

    dmsVPCServiceRole.addManagedPolicy(dmsVpcManagementRolePolicy);

    
    // // Create a subnet group that allows DMS to access your data
    const subnet = new dms.CfnReplicationSubnetGroup(this, 'SubnetGroup', {
      replicationSubnetGroupIdentifier: 'cdk-subnetgroup',
      replicationSubnetGroupDescription: 'Subnets that have access to my data source and target.',
      subnetIds: ['subnet-37e87c5c', 'subnet-85e220f8']
    });

    subnet.node.addDependency(dmsVPCServiceRole);



    const dmsInstance = new dms.CfnReplicationInstance(this, 'DMSInstance', {
      replicationInstanceIdentifier: 'cdk-instance',

      // Use the appropriate instance class: https://docs.aws.amazon.com/dms/latest/userguide/CHAP_ReplicationInstance.Types.html
      replicationInstanceClass: 'dms.t2.small',

      // Setup networking
      replicationSubnetGroupIdentifier: subnet.replicationSubnetGroupIdentifier,
      vpcSecurityGroupIds: [ 'sg-04dcf94f' ],
    });

    dmsInstance.node.addDependency(subnet)


    // Create endpoints for your data, see https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-dms-endpoint.html
const rdsSource = new dms.CfnEndpoint(this, 'RDS-Source', {
  endpointIdentifier: 'rds-source',
  endpointType: 'source', 
  engineName: 'postgres',

  serverName: dbInstance.dbInstanceEndpointAddress,
  port: 5432,
  databaseName: 'dotdata',
  username: 'dms-user',
  password: 'password-from-secret',
});

const s3RawDatatarget = new dms.CfnEndpoint(this, 'S3RawTarget', {
  endpointIdentifier: 's3RawData',
  endpointType: 'target',
  engineName: 's3',

  s3Settings: {
    bucketName: 's3RawData',
    serviceAccessRoleArn: dmsVPCServiceRole.roleArn,
  },
});


  //  grant permissions on table
  dynamotable.grantReadData(dmsVPCServiceRole);

const dynamoRawDatatarget = new dms.CfnEndpoint(this, 'Dynamo-Target', {
  endpointIdentifier: 'dynamotable',
  endpointType: 'target',
  engineName: 'dynamodb',
  dynamoDbSettings: {
    serviceAccessRoleArn: dmsVPCServiceRole.roleArn,
  },

});





// Define the replication task for s3
const s3ReplicateTask = new dms.CfnReplicationTask(this, 'S3DmsReplicationTask', {
  replicationInstanceArn: dmsInstance.ref,

  migrationType: 'full-load-and-cdc', // https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-dms-replicationtask.html#cfn-dms-replicationtask-migrationtype
  sourceEndpointArn: rdsSource.ref,
  targetEndpointArn: s3RawDatatarget.ref, 
  tableMappings: JSON.stringify({
    "rules": [{
      "rule-type": "selection",
      "rule-id": "1",
      "rule-name": "1",
      "object-locator": {
        "schema-name": "%",
        "table-name": "%"
      },
      "rule-action": "include"
    }]
  })
})



 //Tranformations
 // use the Bucket construct
 const s3DataLake = new s3.Bucket(this, 'data-lake-bucket', {
  removalPolicy: cdk.RemovalPolicy.DESTROY,
});

 //Role
 const roleGlueJob = new iam.Role(this, 'roleGlueJob', {
  assumedBy: new iam.ServicePrincipal('glue.amazonaws.com'),
});
roleGlueJob.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSGlueServiceRole'))

roleGlueJob.addToPolicy(
  new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    resources: [s3DataLake.bucketArn, `${s3DataLake.bucketArn}/*`],
    actions: [
      's3:AbortMultipartUpload',
      's3:GetBucketLocation',
      's3:GetObject',
      's3:ListBucket',
      's3:ListBucketMultipartUploads',
      's3:PutObject',
    ],
  })
);


  

    //Setup Glue Database for initial crawl of data
    const rawDataDB = new glue.CfnDatabase(this, "rawDataDatabase",{
      catalogId: this.account,
      databaseInput:{
      name: "rawdatadb"
      }
  })

  //Setup crawler on rawData data
  const rawDataCrawlers = new glue.CfnCrawler(this, "rawDataCrawlers", {
    targets: {
      s3Targets: [{path: "s3://" + s3RawData.bucketName}]
    },
    role: roleGlueJob.roleArn,
    databaseName: "rawdatadb"
    
  })


  //Create glue job to transform data and store in new lake
  let job = new glue.CfnJob(this, "DatatransformedJob",{
    role: roleGlueJob.roleArn,
    glueVersion: "2.0",
    command:{
      name: "glueetl",
      pythonVersion: "3",
      scriptLocation: "s3://"+ s3RawData.bucketName +"/datatranformed_spark.py"
    },
    defaultArguments:{
      "--glue_source_database": "rawdatadb",
      // "--glue_source_table": "dmsstackk_mylakerawData6df26456_agqxvt1ngc70",
      "--glue_temp_storage": "s3://"+ s3RawData.bucketName,
      "--glue_Datatransformed_output_s3_path": "s3://" + s3DataLake.bucketName
    }
  })

  //Setup Glue DB to catalog the new transformed data
  const transformedDB = new glue.CfnDatabase(this, "transformedDB",{
    catalogId: this.account,
    databaseInput:{
    name: "transformeddb"
    }
  })

  //Setup crawler to to crawl and catalog the transformed data
  const transformedDataCrawlers = new glue.CfnCrawler(this, "transformedDataCrawlers", {
    targets: {
      s3Targets: [{path: "s3://" + s3DataLake.bucketName}]
    },
    role: roleGlueJob.roleArn,
    databaseName: "transformeddatadb"
    
  })


  //Glue job to persists the state of data load  
  const cfnJob = new glue.CfnJob(this, 'DynamoDBDataState', {
    role: roleGlueJob.roleArn,
    command: {
      name: 'DynamoDBDataState',
      pythonVersion: 'pythonVersion',
      scriptLocation: "s3://"+ s3RawData.bucketName +"/DynamoDBDataStateScript.py"
    },
      
    // the properties below are optional
    allocatedCapacity: 123,
    connections: {
      connections: ['dynamodb'],
    },
    // defaultArguments: defaultArguments,
    description: 'description',
    executionProperty: {
      maxConcurrentRuns: 123,
    },
    glueVersion: 'glueVersion',
    logUri: 'logUri',
    maxCapacity: 123,
    maxRetries: 123,
    name: 'name',
    notificationProperty: {
      notifyDelayAfter: 123,
    },
    numberOfWorkers: 123,
    securityConfiguration: 'securityConfiguration',
    timeout: 123,
    workerType: 'workerType',
  });
  
 

  }
}