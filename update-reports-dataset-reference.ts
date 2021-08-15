import axios, { AxiosError } from 'axios';

export async function getReportsByGroupId({
  authToken,
  groupId,
}: {
  authToken: string;
  groupId: string;
}) {
  const {
    data: { value },
  } = await axios.get<{
    value: {
      id: string;
      reportType: string;
      name: string;
      webUrl: string;
      embedUrl: string;
      isFromPbix: boolean;
      isOwnedByMe: boolean;
      datasetId: string;
      users: any[];
    }[];
  }>(`https://api.powerbi.com/v1.0/myorg/groups/${groupId}/reports`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (value.length === 0) {
    throw new Error('no_reports_found');
  }

  return value;
}

export async function updateReportsDatasetReference({
  groupId,
  currentReports,
  reports,
  requestBody,
  authToken,
}: {
  groupId: string;
  currentReports: {
    id: string;
    datasetId: string;
  }[];
  reports: string[];
  requestBody: Record<string, any>;
  authToken: string;
}) {
  for (const currentReport of currentReports) {
    if (reports.includes(currentReport.id)) {
      if (currentReport.datasetId === requestBody.datasetId) {
        console.log('skipping_rebind', 'datasetId', currentReport.datasetId);

        continue;
      }

      try {
        await axios.post(
          `https://api.powerbi.com/v1.0/myorg/groups/${groupId}/reports/${currentReport.id}/Rebind`,
          requestBody,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          },
        );

        console.log(
          'rebind_success',
          'dataset_id',
          currentReport.datasetId,
          'report_id',
          currentReport.id,
        );
      } catch (error) {
        console.error(
          'rebind_failed',
          error.message,
          'groupId',
          groupId,
          'report_id',
          currentReport.id,
          'body',
          (error as AxiosError).response?.data,
        );
      }
    } else {
      console.log('not_in_reports', groupId, currentReport.id);
    }
  }
}
