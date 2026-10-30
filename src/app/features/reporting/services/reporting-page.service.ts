import { Injectable, inject, signal } from '@angular/core';
import { catchError, map, Observable, tap, throwError } from 'rxjs';

import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ApiResponse, PagedResponse } from '../../../core/models/api-response.model';
import { checkTrailingSlash } from '../../../shared/utils/checkTrailingSlash';
import { MetricFilterOptions, MetricFilterRequest, ReportFilterIndependentOptions, ReportFilterProjectCascadingOptions, ReportFilterProjectCascadingRequest, ReportRequest } from '../models/reporting.model';

@Injectable({ providedIn: 'root' })
export class ReportingPageService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiBaseUrl}/Report`;
    private readonly mockApiUrl = checkTrailingSlash(environment.apiBaseUrl2) + '/Report';


    private appendArrayParams(
        params: HttpParams,
        key: string,
        values?: string[] | null
    ): HttpParams {

        if (!values?.length) {
            return params;
        }

        values.forEach(value => {
            params = params.append(key, value);
        });

        return params;
    }

    getReportMetricOptions(
        request: MetricFilterRequest
    ): Observable<MetricFilterOptions> {

        let params = new HttpParams();

        params = this.appendArrayParams(
            params,
            'topicIds',
            request.topicIds
        );

        params = this.appendArrayParams(
            params,
            'topLevelMetricIds',
            request.topLevelMetricIds
        );

        params = this.appendArrayParams(
            params,
            'l1MetricIds',
            request.l1MetricIds
        );

        return this.http
            .get<ApiResponse<MetricFilterOptions>>(
                `${this.apiUrl}/metric-filter-options`,
                { params }
            )
            .pipe(
                map(res => res.data)
            );
    }

    getReportProjectFilterOptions(
        request: ReportFilterProjectCascadingRequest
    ): Observable<ReportFilterProjectCascadingOptions> {

        let params = new HttpParams();

        console.log("request", request)

        params = this.appendArrayParams(
            params,
            'projectIds',
            request.projectIds
        );

        params = this.appendArrayParams(
            params,
            'cpmUserIds',
            request.cpmUserIds
        );

        params = this.appendArrayParams(
            params,
            'gelUserIds',
            request.gelUserIds
        );

        params = this.appendArrayParams(
            params,
            'plUserIds',
            request.plUserIds
        );

        params = this.appendArrayParams(
            params,
            'fundingRecipientIds',
            request.fundingRecipientIds
        );

        params = this.appendArrayParams(
            params,
            'programIds',
            request.programIds
        );

        params = this.appendArrayParams(
            params,
            'countryCodes',
            request.countryCodes
        );

        params = this.appendArrayParams(
            params,
            'cityIds',
            request?.cityIds
        );

        params = this.appendArrayParams(
            params,
            'reportingYears',
            request?.reportingYears
        );

        params = this.appendArrayParams(
            params,
            'quarterCodes',
            request?.quarterCodes

        );
        params = params.append(
            'selectedReportType',
            request.selectedReportType || ''
        );


        return this.http
            .get<ApiResponse<ReportFilterProjectCascadingOptions>>(
                `${this.apiUrl}/report-filter-project-cascading-options`,
                { params }
            )
            .pipe(
                map(res => res.data)
            );
    }

    getReportIndependentFilterOptions(projectIds: any): Observable<ReportFilterIndependentOptions> {
        let params = new HttpParams();
        params = this.appendArrayParams(
            params,
            "projectIds",
            projectIds

        )
        return this.http
            .get<ApiResponse<ReportFilterIndependentOptions>>(
                `${this.apiUrl}/report-independent-filter-options`, { params },
            )
            .pipe(
                map((res: { data: ReportFilterIndependentOptions }) => {
                    console.log(
                        'ReportFilterIndependentOptions:',
                        res.data,
                    );

                    return res.data;
                }),
            );
    }

    postGenerateReport(
        request: ReportRequest,
        userId: string
    ): Observable<any> {
        const headers = new HttpHeaders({
            UserId: userId
        });

        return this.http.post(
            `${this.apiUrl}/generate`,
            request,
            {
                headers,
                responseType: 'blob',
                observe: 'response'
            }
        );
    }

}