import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { CreateProductDto, ProductDto, UpdateProductDto } from '../models/product';

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private baseUrl = `${environment.apiBaseUrl}/api/products`;

  constructor(private http: HttpClient) {}

  getAll() {
    return this.http.get<ProductDto[]>(this.baseUrl);
  }

  getById(id: number) {
    return this.http.get<ProductDto>(`${this.baseUrl}/${id}`);
  }

  create(dto: CreateProductDto) {
    return this.http.post<ProductDto>(this.baseUrl, dto);
  }

  update(id: number, dto: UpdateProductDto) {
    return this.http.put<void>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: number) {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
