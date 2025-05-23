// Code generated by protoc-gen-ts_proto. DO NOT EDIT.
// versions:
//   protoc-gen-ts_proto  v2.4.1
//   protoc               v3.20.3
// source: discount.proto

/* eslint-disable */
import { GrpcMethod, GrpcStreamMethod } from '@nestjs/microservices';
import { Observable } from 'rxjs';

export const protobufPackage = 'DiscountProtoService';

export enum DiscountType {
  OWNER = 0,
  SYSTEM = 1,
  UNRECOGNIZED = -1,
}

export interface CreateDiscountRequest {
  type: DiscountType;
  percentage: number;
  code: string;
  flatAmount: number;
  startDate: string;
  endDate: string;
  courseIds: string[];
  ownerId: string;
  usageLimit: number;
}

export interface UpdateDiscountRequest {
  discountId: number;
  code: string;
  type: DiscountType;
  percentage: number;
  flatAmount: number;
  startDate: string;
  endDate: string;
  courseIds: string[];
  ownerId: string;
  usageLimit: number;
}

export interface ApplyDiscountRequest {
  discountId: number;
  courseId: string;
  userId: string;
}

export interface DisableDiscountRequest {
  discountId: number;
}

export interface GetDiscountsByOwnerRequest {
  ownerId: string;
}

export interface GetDiscountByCourseRequest {
  courseId: string;
}

export interface DiscountResponse {
  id: number;
  status: string;
}

export interface ApplyDiscountResponse {
  status: string;
  discountAmount: number;
}

export interface GetDiscountResponse {
  discounts: Discount[];
}

export interface Discount {
  id: number;
  type: DiscountType;
  percentage: number;
  flatAmount: number;
  startDate: string;
  endDate: string;
  code: string;
  courseIds: string[];
  ownerId: string;
  usageLimit: number;
  isActive: boolean;
  usageCount: number;
}

export const DISCOUNT_PROTO_SERVICE_PACKAGE_NAME = 'DiscountProtoService';

export interface DiscountServiceClient {
  createDiscount(request: CreateDiscountRequest): Observable<DiscountResponse>;

  applyDiscount(
    request: ApplyDiscountRequest,
  ): Observable<ApplyDiscountResponse>;

  disableDiscount(
    request: DisableDiscountRequest,
  ): Observable<ApplyDiscountResponse>;

  updateDiscount(request: UpdateDiscountRequest): Observable<DiscountResponse>;

  getDiscountsByOwner(
    request: GetDiscountsByOwnerRequest,
  ): Observable<GetDiscountResponse>;

  getDiscountByCourse(
    request: GetDiscountByCourseRequest,
  ): Observable<GetDiscountResponse>;
}

export interface DiscountServiceController {
  createDiscount(
    request: CreateDiscountRequest,
  ):
    | Promise<DiscountResponse>
    | Observable<DiscountResponse>
    | DiscountResponse;

  applyDiscount(
    request: ApplyDiscountRequest,
  ):
    | Promise<ApplyDiscountResponse>
    | Observable<ApplyDiscountResponse>
    | ApplyDiscountResponse;

  disableDiscount(
    request: DisableDiscountRequest,
  ):
    | Promise<ApplyDiscountResponse>
    | Observable<ApplyDiscountResponse>
    | ApplyDiscountResponse;

  updateDiscount(
    request: UpdateDiscountRequest,
  ):
    | Promise<DiscountResponse>
    | Observable<DiscountResponse>
    | DiscountResponse;

  getDiscountsByOwner(
    request: GetDiscountsByOwnerRequest,
  ):
    | Promise<GetDiscountResponse>
    | Observable<GetDiscountResponse>
    | GetDiscountResponse;

  getDiscountByCourse(
    request: GetDiscountByCourseRequest,
  ):
    | Promise<GetDiscountResponse>
    | Observable<GetDiscountResponse>
    | GetDiscountResponse;
}

export function DiscountServiceControllerMethods() {
  return function (constructor: Function) {
    const grpcMethods: string[] = [
      'createDiscount',
      'applyDiscount',
      'disableDiscount',
      'updateDiscount',
      'getDiscountsByOwner',
      'getDiscountByCourse',
    ];
    for (const method of grpcMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(
        constructor.prototype,
        method,
      );
      GrpcMethod('DiscountService', method)(
        constructor.prototype[method],
        method,
        descriptor,
      );
    }
    const grpcStreamMethods: string[] = [];
    for (const method of grpcStreamMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(
        constructor.prototype,
        method,
      );
      GrpcStreamMethod('DiscountService', method)(
        constructor.prototype[method],
        method,
        descriptor,
      );
    }
  };
}

export const DISCOUNT_SERVICE_NAME = 'DiscountService';
