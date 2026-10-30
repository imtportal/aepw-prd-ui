

export enum BulkLaunchActionKey {
    ADD = 'ADD',
    DELETE = 'DELETE',
}

export enum ReviewFilterValue {
    Created = 'created',
    Pending = 'pending'
}

export const ReviewFilterLabels: { [key: string]: string } = {
    [ReviewFilterValue.Created]: 'Created Review',
    [ReviewFilterValue.Pending]: 'Pending Review',
}