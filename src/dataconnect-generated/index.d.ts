import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, MutationRef, MutationPromise } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface CreateNewCustomerData {
  customer_insert: Customer_Key;
}

export interface Customer_Key {
  id: UUIDString;
  __typename?: 'Customer_Key';
}

export interface DeliveryPerson_Key {
  id: UUIDString;
  __typename?: 'DeliveryPerson_Key';
}

export interface Delivery_Key {
  id: UUIDString;
  __typename?: 'Delivery_Key';
}

export interface GetCustomerOrdersData {
  customer?: {
    orders_on_customer: ({
      id: UUIDString;
      orderNumber: string;
      orderDate: DateString;
      status: string;
      totalAmount?: number | null;
    } & Order_Key)[];
  };
}

export interface GetCustomerOrdersVariables {
  customerId: UUIDString;
}

export interface ListAllDeliveryPeopleData {
  deliveryPeople: ({
    id: UUIDString;
    name: string;
    phoneNumber: string;
    vehicleType: string;
    status: string;
  } & DeliveryPerson_Key)[];
}

export interface Order_Key {
  id: UUIDString;
  __typename?: 'Order_Key';
}

export interface UpdateOrderStatusData {
  order_update?: Order_Key | null;
}

export interface UpdateOrderStatusVariables {
  orderId: UUIDString;
  status: string;
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

interface CreateNewCustomerRef {
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<CreateNewCustomerData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): MutationRef<CreateNewCustomerData, undefined>;
  operationName: string;
}
export const createNewCustomerRef: CreateNewCustomerRef;

export function createNewCustomer(): MutationPromise<CreateNewCustomerData, undefined>;
export function createNewCustomer(dc: DataConnect): MutationPromise<CreateNewCustomerData, undefined>;

interface ListAllDeliveryPeopleRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListAllDeliveryPeopleData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListAllDeliveryPeopleData, undefined>;
  operationName: string;
}
export const listAllDeliveryPeopleRef: ListAllDeliveryPeopleRef;

export function listAllDeliveryPeople(): QueryPromise<ListAllDeliveryPeopleData, undefined>;
export function listAllDeliveryPeople(dc: DataConnect): QueryPromise<ListAllDeliveryPeopleData, undefined>;

interface UpdateOrderStatusRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateOrderStatusVariables): MutationRef<UpdateOrderStatusData, UpdateOrderStatusVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateOrderStatusVariables): MutationRef<UpdateOrderStatusData, UpdateOrderStatusVariables>;
  operationName: string;
}
export const updateOrderStatusRef: UpdateOrderStatusRef;

export function updateOrderStatus(vars: UpdateOrderStatusVariables): MutationPromise<UpdateOrderStatusData, UpdateOrderStatusVariables>;
export function updateOrderStatus(dc: DataConnect, vars: UpdateOrderStatusVariables): MutationPromise<UpdateOrderStatusData, UpdateOrderStatusVariables>;

interface GetCustomerOrdersRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetCustomerOrdersVariables): QueryRef<GetCustomerOrdersData, GetCustomerOrdersVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetCustomerOrdersVariables): QueryRef<GetCustomerOrdersData, GetCustomerOrdersVariables>;
  operationName: string;
}
export const getCustomerOrdersRef: GetCustomerOrdersRef;

export function getCustomerOrders(vars: GetCustomerOrdersVariables): QueryPromise<GetCustomerOrdersData, GetCustomerOrdersVariables>;
export function getCustomerOrders(dc: DataConnect, vars: GetCustomerOrdersVariables): QueryPromise<GetCustomerOrdersData, GetCustomerOrdersVariables>;

