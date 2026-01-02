export interface ProductDto {
  id: number;
  name: string;
  price: number;
  stock: number;
  categoryId: number;
  categoryName?: string | null;
}

export interface CreateProductDto {
  name: string;
  price: number;
  stock: number;
  categoryId: number;
}

export interface UpdateProductDto {
  name: string;
  price: number;
  stock: number;
  categoryId: number;
}
