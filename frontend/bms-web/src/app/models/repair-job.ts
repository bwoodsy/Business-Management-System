export interface RepairJobItemDto {
  productId: number;
  productName: string;
  quantity: number;
  unitCost: number;
  lineCost: number;
}

export interface RepairJobDto {
  id: number;
  createdAt: string;
  customerId?: number | null;
  customerName?: string | null;
  salePrice: number;
  partsCost: number;
  profit: number;
  notes?: string | null;
  status: string;
  completedAt?: string | null;
  isReturnedToCustomer: boolean;
  returnedAt?: string | null;
  items: RepairJobItemDto[];
}

export interface CreateRepairJobItemDto {
  productId: number;
  quantity: number;
}

export interface CreateRepairJobDto {
  customerId?: number | null;
  salePrice: number;
  notes?: string | null;
  items: CreateRepairJobItemDto[];
}

export interface UpdateRepairJobStatusDto {
  status: string;
  isReturnedToCustomer?: boolean;
}

export interface UpdateRepairJobItemDto {
  productId: number;
  quantity: number;
}

export interface UpdateRepairJobDto {
  customerId?: number | null;
  salePrice: number;
  notes?: string | null;
  items?: UpdateRepairJobItemDto[];
}
