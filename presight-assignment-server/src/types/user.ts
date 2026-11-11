export type User = {
  id: number;
  avatar: string;
  first_name: string;
  last_name: string;
  profession: string;
  age: number;
  nationality: string;
  hobbies: string[];
};

export type FacetItem = {
  value: string;
  count: number;
};

export type FacetsResponse = {
  hobbies: FacetItem[];
  nationalities: FacetItem[];
};

export type UserFilters = {
  q?: string;
  nationalities: string[];
  hobbies: string[];
};

export type UsersListQuery = {
  pageable: import("../pagination/types.js").Pageable;
  filters: UserFilters;
};
