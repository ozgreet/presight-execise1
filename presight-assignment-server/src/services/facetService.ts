import { userRepository } from "../repositories/userRepository.js";
import type { FacetsResponse, UserFilters } from "../types/user.js";

export const facetService = {
  async getFacets(filters: UserFilters): Promise<FacetsResponse> {
    const [hobbies, nationalities] = await Promise.all([
      userRepository.findTopHobbies(filters),
      userRepository.findTopNationalities(filters),
    ]);

    return { hobbies, nationalities };
  },
};
