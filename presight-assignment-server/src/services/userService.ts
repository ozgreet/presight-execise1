import { toPaginatedResponse, type PaginatedResponse } from "../pagination/index.js";
import { userRepository } from "../repositories/userRepository.js";
import type { User, UserFilters } from "../types/user.js";
import type { Pageable } from "../pagination/types.js";

export const userService = {
  async listUsers(
    pageable: Pageable,
    filters: UserFilters,
  ): Promise<PaginatedResponse<User>> {
    const page = await userRepository.findPage(pageable, filters);
    const hobbiesByUserId = await userRepository.findHobbiesByUserIds(
      page.content.map((user) => user.id),
    );

    const usersWithHobbies = page.content.map((user) => ({
      ...user,
      hobbies: hobbiesByUserId.get(user.id) ?? [],
    }));

    return toPaginatedResponse({
      content: usersWithHobbies,
      page: page.page,
    });
  },
};
