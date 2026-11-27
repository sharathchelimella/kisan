import {
  reportQuerySchema,
  reportSchema,
  type ReportQuery,
} from "@kisan/contracts";
import { aggregateReport, reportCsv, type ReportSource } from "@kisan/domain";
export { reportCsv };

export interface ReportReadRepository {
  read(businessId: string, query: ReportQuery): Promise<ReportSource>;
}
export function createReportService(repository: ReportReadRepository) {
  return async (businessId: string, raw: unknown) => {
    const query = reportQuerySchema.parse(raw);
    return reportSchema.parse(
      aggregateReport(query, await repository.read(businessId, query)),
    );
  };
}
