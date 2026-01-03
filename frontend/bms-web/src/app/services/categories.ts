import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { CategoryDto, CreateCategoryDto, UpdateCategoryDto } from '../models/category';

@Injectable({ providedIn: 'root' })
export class CategoriesService {
  private baseUrl = `${environment.apiBaseUrl}/api/categories`;

  constructor(private http: HttpClient) {}

  getAll() {
    return this.http.get<CategoryDto[]>(this.baseUrl);
  }

  getById(id: number) {
    return this.http.get<CategoryDto>(`${this.baseUrl}/${id}`);
  }

  create(dto: CreateCategoryDto) {
    return this.http.post<CategoryDto>(this.baseUrl, dto);
  }

  update(id: number, dto: UpdateCategoryDto) {
    return this.http.put<void>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: number) {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
