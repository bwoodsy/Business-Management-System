import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { CreateCustomerDto, CustomerDto } from '../models/customer';

@Injectable({ providedIn: 'root' })
export class CustomersService {
  private baseUrl = `${environment.apiBaseUrl}/api/customers`;

  constructor(private http: HttpClient) {}

  getAll() {
    return this.http.get<CustomerDto[]>(this.baseUrl);
  }

  create(dto: CreateCustomerDto) {
    return this.http.post<CustomerDto>(this.baseUrl, dto);
  }
}
