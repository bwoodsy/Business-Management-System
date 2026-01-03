import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { CreateRepairJobDto, RepairJobDto, UpdateRepairJobStatusDto } from '../models/repair-job';

@Injectable({ providedIn: 'root' })
export class RepairJobsService {
  private baseUrl = `${environment.apiBaseUrl}/api/repairjobs`;

  constructor(private http: HttpClient) {}

  getAll() {
    return this.http.get<RepairJobDto[]>(this.baseUrl);
  }

  create(dto: CreateRepairJobDto) {
    return this.http.post<RepairJobDto>(this.baseUrl, dto);
  }

  updateStatus(id: number, dto: UpdateRepairJobStatusDto) {
    return this.http.put<void>(`${this.baseUrl}/${id}/status`, dto);
  }
}
