import axios from 'axios';

process.on('unhandledRejection', (error) => {
  console.error('error', error);

  process.exit(1);
});

function parseArguments(args: string[]): {
  tenant_id: string;
  username: string;
  password: string;
  client_id: string;
  client_secret: string;
  scope: string;
  resource: string;
  environment: string;
} {
  const expectedArgs = [
    'tenant_id',
    'username',
    'password',
    'client_id',
    'client_secret',
    'scope',
    'resource',
    'environment',
  ];

  const parsedArgs: any = {};

  args.forEach((arg, index) => {
    if (expectedArgs.includes(`--${arg}`)) {
      const nextArgument = args[index + 1];

      if (!nextArgument) {
        throw new Error('bad_argument');
      }

      parsedArgs[arg] = nextArgument;
    }
  });

  return parsedArgs;
}

async function retrieveToken({
  tenantId,
  username,
  password,
  clientId,
  clientSecret,
  scope,
  resource,
}: {
  tenantId: string;
  username: string;
  password: string;
  clientId: string;
  clientSecret: string;
  scope: string;
  resource: string;
}): Promise<string> {
  const { data } = await axios.post<{ access_token: string }>(
    `https://login.windows.net/${tenantId}/oauth2/token`,
    {
      Headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: [
        'grant_type=password',
        `username=${username}`,
        `password=${password}`,
        `client_id=${clientId}`,
        `client_secret=${clientSecret}`,
        `scope=${scope}`,
        `resource=${resource}`,
      ].join('&'),
    },
  );

  return data.access_token;
}

async function getGroupId({
  environment,
  authToken,
}: {
  environment: string;
  authToken: string;
}): Promise<string> {
  const {
    data: { value },
  } = await axios.get<{
    value: {
      name: string;
      id: string;
    }[];
  }>('https://api.powerbi.com/v1.0/myorg/groups', {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  let groupId: string | undefined;

  for (const group of value) {
    if (group.name === environment) {
      groupId = group.id;
    }
  }

  if (!groupId) {
    throw new Error('error_no_group_id');
  }

  console.log('get_group_id', groupId);

  return groupId;
}

(async () => {
  const {
    tenant_id,
    username,
    password,
    client_id,
    client_secret,
    scope,
    resource,
    environment,
  } = parseArguments(process.argv);

  console.log('parsed_args', {
    tenant_id,
    username,
    client_id,
    scope,
    resource,
    environment,
  });

  const authToken = await retrieveToken({
    tenantId: tenant_id,
    username,
    password,
    clientId: client_id,
    clientSecret: client_secret,
    scope,
    resource,
  });

  const groupId = await getGroupId({
    environment,
    authToken,
  });

  console.log(`##vso[task.setvariable variable=group_id]${groupId}`);

  process.exit(0);
})();
