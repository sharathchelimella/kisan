import type {
  CatalogQuery,
  Equipment,
  EquipmentInput,
  Service,
  ServiceInput,
  PageResult,
} from "@kisan/contracts";
import type { calculateEquipmentAnalytics } from "@kisan/contracts";

export interface CatalogClient {
  equipment(query: CatalogQuery): Promise<PageResult<Equipment>>;
  services(query: CatalogQuery): Promise<PageResult<Service>>;
  saveEquipment(input: EquipmentInput, id?: string): Promise<Equipment>;
  saveService(input: ServiceInput, id?: string): Promise<Service>;
  getEquipment(id: string): Promise<Equipment | null>;
  analytics(from?: string, to?: string): Promise<ReturnType<typeof calculateEquipmentAnalytics>>;
}
