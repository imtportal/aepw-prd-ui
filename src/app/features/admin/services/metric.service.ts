import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map, mergeMap, Observable, of, tap, throwError } from 'rxjs';
import { Metric, MetricCategory, MetricCategory2, MetricCategoryDto, MetricConfigurationSaveRequest, MetricEvidenceType } from '../models/metric.model';
import { ApiResponse } from '../../../core/models/api-response.model';
import { environment } from '../../../../environments/environment';
import { MetricDto } from '../models/project.model';
import { mapStageToFormattedKeys } from '../../dashboard/containers/dashboard-page.model';
import { checkTrailingSlash } from '../../../shared/utils/checkTrailingSlash';

@Injectable({ providedIn: 'root' })
export class MetricService {
  private readonly http = inject(HttpClient);
  
  private readonly useMocks = false; // real endpoint ready
  private readonly apiUrl = checkTrailingSlash(environment.apiBaseUrl, true) + 'Metric';
  private readonly mockApiUrl = checkTrailingSlash(environment.apiBaseUrl2, true) + 'metrics';
  private get url(): string {
    return this.useMocks ? this.mockApiUrl : this.apiUrl;
  }

  private readonly _metrics = signal<Metric[]>([]);
  readonly metrics = this._metrics.asReadonly();

  private _metricsLoading = signal<boolean>(false);
  readonly metricsLoading = this._metricsLoading.asReadonly();

  getMetricHierarchy(): Observable<ApiResponse<MetricCategory2[]>> {
    return this.http.get<ApiResponse<MetricCategory2[]>>(this.apiUrl).pipe(
      tap((response) => {
        console.log('[MetricService] Get All Metrics data:', response);
      }),

      catchError((error) => {
        console.error('Error fetching metric hierarchy', error);

        return throwError(() => error);
      }),
    );
  }

  getAllMetrics(): Observable<ApiResponse<MetricDto[]>> {
    return this.http.get<ApiResponse<MetricDto[]>>(`${this.apiUrl}/GetAllMetrics`);
  }
  saveMetricConfiguration(request: MetricConfigurationSaveRequest): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/configuration`, request).pipe(
      tap((response) => {
        console.log('[MetricService] Save Metric Configuration:', response);
      }),
      catchError((error) => {
        console.error('Error saving metric configuration', error);
        return throwError(() => error);
      }),
    );
  }

  // /////////////////////////////////////////////////////////////////////////////////
  getReviewMetrics(id: string, updateMetricsCache: boolean = false): Observable<Metric[]> {
    return this.http.get<ApiResponse<MetricDto[]>>(this.apiUrl + '/GetMetricsForReview/' + id).pipe(
      catchError(() => of({ data: [], status111: 0 })),
      map((res) => {
        const list = res.data;
        const result: Metric[] = [];

        for (const sample of list) {
          result.push({
            metricId: +sample.metricId,
            code: sample.metricCode,
            name: sample.metricName,
            description: sample.description,
            categoryId: +(sample.categoryId || 0),
            unit: sample.unitName,
            isTopLevel: sample.isTopLevel,
            parentMetricId: sample.parentMetricId ? +sample.parentMetricId : null,
            isCorporate: sample.isCorporate,
            defaultRiskPct: sample.defaultRiskPct,
            riskOriginal: sample.riskOriginal,
            evidenceRequiredMin: sample.evidenceRequiredMin,
            isActive: sample.isActive,
            riskPctEffective: sample.riskPctEffective,
            categoryColor: sample.categoryColor,
            effectiveFromUtc: sample.effectiveFromUtc,
            createdBy: 0, //TODO:  use real value later
          } as Metric);
        }
        return result;
      }),
      tap((metrics) => {
        if (updateMetricsCache) {
          this._metrics.update(() => metrics);
        }
      }),
    );
  }

  GetMetricsForProject(projectId: number, pendingReviewStatus: string = '', reviewId: number = 0) {
    this._metrics.set([]);
    this._metricsLoading.set(true);
    return this.http
      .get<ApiResponse<MetricDto[]>>(this.apiUrl + '/GetMetricsForProject/' + projectId)
      .pipe(
        catchError(() => of({ data: [], status: 0 })),
        mergeMap((metricsForProjectResponse) => {
          if (reviewId) {
            return this.getReviewMetrics(String(reviewId)).pipe(
              map((reviewMetrics) => {
                const riskOriginalForMetricCode: Map<string, number> = new Map<string, number>();
                const riskEffectiveForMetricCode: Map<string, number> = new Map<string, number>();

                for (const metric of reviewMetrics) {
                  if (metric.riskOriginal != undefined) {
                    riskOriginalForMetricCode.set(metric.code, +metric.riskOriginal);
                  }
                  if (metric.riskPctEffective != undefined) {
                    riskEffectiveForMetricCode.set(metric.code, +metric.riskPctEffective);
                  }
                }

                const metricsForProjectResponseData: MetricDto[] = [];

                for (const metric of metricsForProjectResponse.data) {
                  let defaultRiskPct = riskOriginalForMetricCode.get(metric.metricCode) || 0;

                  // const statuses = mapStageToFormattedKeys({ "Pending Risk Adjust": "pending", "Pending Review Launch": "confirmed" });

                  // switch (statuses[pendingReviewStatus]) {
                  //   case "pending": {
                  //     defaultRiskPct = riskEffectiveForMetricCode.get(metric.metricCode) || defaultRiskPct;
                  //     break;
                  //   }
                  //   case "confirmed": {
                  //     defaultRiskPct = riskOriginalForMetricCode.get(metric.metricCode) || defaultRiskPct;
                  //     break;
                  //   }
                  // }
                  // : riskOriginalForMetricCode.get(metric.metricCode) || metric.defaultRiskPct
                  metricsForProjectResponseData.push({
                    ...metric,
                    defaultRiskPct,
                  });
                }

                return { ...metricsForProjectResponse, data: metricsForProjectResponseData };
              }),
            );
          }

          return of(metricsForProjectResponse);
        }),
        map((res) => {
          const list = res.data;

          const result: Metric[] = [];

          for (const sample of list) {
            result.push({
              metricId: +sample.metricId,
              code: sample.metricCode,
              name: sample.metricName,
              description: sample.description,
              categoryId: +(sample.categoryId || 0),
              unit: sample.unitName,
              isTopLevel: sample.isTopLevel,
              parentMetricId: sample.parentMetricId ? +sample.parentMetricId : null,
              isCorporate: sample.isCorporate,
              defaultRiskPct: sample.defaultRiskPct,
              evidenceRequiredMin: sample.evidenceRequiredMin,
              isActive: sample.isActive,
              effectiveFromUtc: sample.effectiveFromUtc,
              createdBy: 0, //TODO:  use real value later
            } as Metric);
          }

          this._metricsLoading.set(false);
          return { ...res, data: result };
        }),
        tap((response) => {
          console.log('[MetricService] Get All Metrics data:', response);

          this._metricsLoading.set(false);
          this._metrics.update(() => response.data);
        }),
      );
  }

  toggleActive(code: string): Observable<ApiResponse<boolean>> {
    return this.http.patch<ApiResponse<boolean>>(`${this.url}/${code}/toggle`, {}).pipe(
      tap((res) => {
        this._metrics.update((list) =>
          list.map((m) => (m.code === code ? { ...m, isActive: !m.isActive } : m)),
        );
        console.log('[MetricService] Toggle Active Success:', res);
      }),
      catchError((err) => {
        console.error('[MetricService] Toggle Active Error:', err);
        return throwError(() => err);
      }),
    );
  }

  updateMetric(code: string, changes: Partial<Metric>): Observable<ApiResponse<Metric>> {
    return this.http.put<ApiResponse<Metric>>(`${this.url}/${code}`, changes).pipe(
      tap((res) => {
        this._metrics.update((list) =>
          list.map((m) => (m.code === code ? { ...m, ...changes } : m)),
        );
        console.log('[MetricService] Update Metric Success:', res);
      }),
      catchError((err) => {
        console.error('[MetricService] Update Metric Error:', err);
        return throwError(() => err);
      }),
    );
  }


  getEvidenceTypeForMetric(metricCodes: string[] = [], metricIds: number[] = []) {
    const headers = new HttpHeaders()
    .set('metricCodes', metricCodes.join(","))
    .set('metricIds', String(metricIds.join(",")))
    return this.http.get<ApiResponse<MetricEvidenceType[]>>(`${this.url}/GetEvidenceTypeForMetric`, { headers })
    .pipe(
      map(x=> x.data || [])
    )
  }
  // addMetric(metric: Metric): Observable<ApiResponse<Metric>> {
  //   return this.http.post<ApiResponse<Metric>>(this.url, metric).pipe(
  //     tap((res) => {
  //       if (res.data) this._metrics.update((list) => [...list, res.data]);
  //       console.log('[MetricService] Add Metric Success:', res);
  //     }),
  //     catchError((err) => {
  //       console.error('[MetricService] Add Metric Error:', err);
  //       return throwError(() => err);
  //     }),
  //   );
  // }
}
