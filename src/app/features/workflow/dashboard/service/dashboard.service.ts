import { Injectable, inject } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { environment } from "../../../../../environments/environment";
import {  DashboardPortfolioAdjustmentByCategories, DashboardPortfolioByCategoriesRequest, DashboardPortfolioList, DashboardPortfolioListRequest } from "../model/dashboard.model";
import { catchError, tap, throwError } from "rxjs";
import { ApiResponse } from "../../../admin/models/project.model";
import { PagedResponse } from "../../../../core/models/api-response.model";

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
    private readonly http = inject(HttpClient);

    private readonly apiUrl = `${environment.apiBaseUrl}/Dashboard/portfolio`;

  getDashboardPortfolioAdjustmentByCategories(
  request: DashboardPortfolioByCategoriesRequest
    ) {
      let params = new HttpParams()
        .set('CategoryCode', request.categoryCode)
        .set('SinceInception', request.sinceInception.toString());

      request.reviewPeriodCodes.forEach((periodCode) => {
        params = params.append('ReviewPeriodCodes', periodCode);
      });

      return this.http
        .get<ApiResponse<DashboardPortfolioAdjustmentByCategories[]>>(
          `${this.apiUrl}/adjustment-by-categories`,
          { params }
        )
        .pipe(
          tap((response) => {
            console.log(
              '[DashboardService] Get Dashboard Portfolio Adjustment By Categories Success:',
              response
            );
          }),
          catchError((error) => {
            console.error(
              '[DashboardService] Get Dashboard Portfolio Adjustment By Categories Error:',
              error
            );
            return throwError(() => error);
          })
        );
    }

       getDashboardPortfolioList(request: DashboardPortfolioListRequest) {
            let params = new HttpParams()
              .set('SinceInception', request.sinceInception.toString());

            if (request.categoryCode != null) {
              params = params.set('CategoryCode', request.categoryCode);
            }

            if (request.programId != null) {
              params = params.set('ProgramId', request.programId);
            }

            if (request.statusId != null) {
              params = params.set('StatusId', request.statusId);
            }

            if (request.recordTypeId != null) {
              params = params.set('RecordTypeId', request.recordTypeId);
            }

            if (request.searchTerm != null) {
              params = params.set('SearchTerm', request.searchTerm);
            }

            params = params
              .set('PageNumber', request.pageNumber.toString())
              .set('PageSize', request.pageSize.toString());

            // Send each period separately
            request.reviewPeriodCodes.forEach((periodCode) => {
              params = params.append('ReviewPeriodCodes', periodCode);
            });

            return this.http
              .get<ApiResponse<DashboardPortfolioList>>(
                `${this.apiUrl}`,
                { params }
              )
              .pipe(
                tap((response) => {
                  console.log(
                    '[DashboardService] Get Dashboard Portfolio Success:',
                    response
                  );
                }),
                catchError((error) => {
                  console.error(
                    '[DashboardService] Get Dashboard Portfolio Error:',
                    error
                  );
                  return throwError(() => error);
                })
              );
          }
    
}