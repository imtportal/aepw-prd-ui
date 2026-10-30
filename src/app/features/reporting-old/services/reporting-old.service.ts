import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, tap, throwError } from 'rxjs';
import {
  Program, ReportingProject, YoyDataPoint, PieDataPoint, TopLevelMetric, ReportingDashboardDto,
} from '../models/reporting.modelold';
import { ApiResponse } from '../../../core/models/api-response.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReportingService {
  private readonly http       = inject(HttpClient);
  private readonly useMocks   = true;                                // flip to false when endpoint is ready
  private readonly apiUrl     = environment.apiBaseUrl  + '/Reporting';
  private readonly mockApiUrl = environment.apiBaseUrl2 + '/reporting';
  private get url(): string   { return this.useMocks ? this.mockApiUrl : this.apiUrl; }

  private readonly _programs    = signal<Program[]>([]);
  private readonly _projects    = signal<ReportingProject[]>([]);
  private readonly _selectedId  = signal<string | null>(null);
  private readonly _aepwMetrics = signal<TopLevelMetric[]>([]);
  private readonly _yoyData     = signal<YoyDataPoint[]>([]);
  private readonly _pieData     = signal<PieDataPoint[]>([]);

  readonly programs    = this._programs.asReadonly();
  readonly projects    = this._projects.asReadonly();
  readonly aepwMetrics = this._aepwMetrics.asReadonly();
  readonly yoyData     = this._yoyData.asReadonly();
  readonly pieData     = this._pieData.asReadonly();
  readonly loading     = signal(false);
  readonly error       = signal<string | null>(null);

  readonly selectedProgram = computed(() => {
    const id = this._selectedId();
    return id ? (this._programs().find(p => p.id === id) ?? null) : null;
  });

  readonly programProjects = computed(() => {
    const prog = this.selectedProgram();
    return prog
      ? this._projects().filter(p => p.program === prog.name)
      : this._projects();
  });

  selectProgram(id: string | null): void {
    this._selectedId.set(id);
  }

  load(): Observable<ApiResponse<ReportingDashboardDto>> {
    return this.http.get<ApiResponse<ReportingDashboardDto>>(this.url).pipe(
      tap(res => {
        if (res.data) {
          this._programs.set(res.data.programs);
          this._projects.set(res.data.projects);
          this._aepwMetrics.set(res.data.aepwMetrics);
          this._yoyData.set(res.data.yoyData);
          this._pieData.set(res.data.pieData);
        }
        console.log('[ReportingService] Load Success:', res);
      }),
      catchError(err => {
        console.error('[ReportingService] Load Error:', err);
        return throwError(() => err);
      }),
    );
  }
}
