class CategoryService {

  constructor(categoryRepository) {
    this.categoryRepository = categoryRepository;
  }

  async createCategory(categoryData) {

    if (categoryData) {

      const { name, slug, image, status } = categoryData;

      if (name) {

        if (typeof name === "string" && name.trim().length > 0) {

          if (slug === undefined || typeof slug === "string") {

            if (image === undefined || typeof image === "string") {

              if (status === undefined || typeof status === "boolean") {

                const existingCategory =
                  await this.categoryRepository.findByName(name.trim());

                if (!existingCategory) {

                  if (slug) {

                    const existingSlug =
                      await this.categoryRepository.findBySlug(slug);

                    if (!existingSlug) {

                      const category =
                        await this.categoryRepository.create({
                          name: name.trim(),
                          slug:
                            slug ||
                            name.trim().toLowerCase().replace(/\s+/g, "-"),
                          image,
                          status: status !== undefined ? status : true,
                        });

                      return {
                        success: true,
                        data: category,
                      };

                    } else {
                      return {
                        success: false,
                        message: "Category with this slug already exists",
                      };
                    }

                  } else {

                    const category =
                      await this.categoryRepository.create({
                        name: name.trim(),
                        slug: name.trim().toLowerCase().replace(/\s+/g, "-"),
                        image,
                        status: status !== undefined ? status : true,
                      });

                    return {
                      success: true,
                      data: category,
                    };

                  }

                } else {
                  return {
                    success: false,
                    message: "Category with this name already exists",
                  };
                }

              } else {
                return {
                  success: false,
                  message: "Status must be a boolean",
                };
              }

            } else {
              return {
                success: false,
                message: "Image must be a string",
              };
            }

          } else {
            return {
              success: false,
              message: "Slug must be a string",
            };
          }

        } else {
          return {
            success: false,
            message: "Category name must be a non-empty string",
          };
        }

      } else {
        return {
          success: false,
          message: "Category name is required",
        };
      }

    } else {
      return {
        success: false,
        message: "Invalid category data",
      };
    }

  }
  async getAllCategories({ offset = 0, limit = 10 }) {
    const { count, rows } = await this.categoryRepository.getAllCategories({ offset, limit });
    const currentPage = Math.floor(offset / limit) + 1;
    const totalPages = Math.ceil(count / limit);

    return {
      success: true,
      data: {
        categories: rows,
        pagination: {
          totalItems: count,
          totalPages,
          currentPage,
          limit,
          hasNextPage: currentPage < totalPages,
          hasPrevPage: currentPage > 1,
        },
      },
    };
  }

  async updateCategory(id, updateData) {
    return await this.categoryRepository.updateById(id, updateData);
  }

  async deleteCategory(id) {
    return await this.categoryRepository.deleteById(id);
  }

}

export default CategoryService;