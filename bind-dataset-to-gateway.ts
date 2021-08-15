import axios from 'axios';

export async function bindDatasetToGateway({
  authToken,
  groupId,
  datasetId,
  body,
}: {
  authToken: string;
  groupId: string;
  datasetId: string;
  body: Record<string, any>;
}) {
  await axios.post(
    `https://api.powerbi.com/v1.0/myorg/groups/${groupId}/datasets/${datasetId}/Default.BindToGateway`,
    body,
    {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    },
  );
}
