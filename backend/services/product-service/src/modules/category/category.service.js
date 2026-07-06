import CategoryRepository from "../repository/category.repository.js";
import SlugMaker from "../../utils/slugMaker.js";
import AppError from "../../utils/AppError.js";
import slugMaker from "../../utils/slugMaker.js";
class CategoryService {
  async createCategory(categoryData) {
    const { name, slug, image, status } = categoryData;
    const existing = await CategoryRepository.findExisting(name.trim(), await slugMaker(name));
    if (existing) {
      throw new AppError("category already exists", 409);
    }
    categoryData.name = name.trim();
    categoryData.slug = await SlugMaker(name);
    const category = await CategoryRepository.create(categoryData);

    return category;

  }

  async getAllCategories({ offset = 0, limit = 10 }) {
    const { count, rows } = await CategoryRepository.getAllCategories({ offset, limit });
    const currentPage = Math.floor(offset / limit) + 1;
    const totalPages = Math.ceil(count / limit);

    return {
    
    
        categories: rows.map(row=>{
          return{
            id:row.id,
            name:row.name,
            slug:row.slug,
            parent_id:row.parent_id,
            image_url:row.image_url,
            description:row.description,
            sort_order:row.sort_order,
            is_active:row.is_active,
            children:row.children,
            parent:row.parent,
            
            
          }
        }),
        pagination: {
          totalItems: count,
          totalPages,
          currentPage,
          limit,
          hasNextPage: currentPage < totalPages,
          hasPrevPage: currentPage > 1,
        },
      
    };
  }


  async updateCategory(id, updateData) {
 

      const existingCategory = await CategoryRepository.findById(id);
      if (!existingCategory) {
        throw new AppError("Category not found", 404);
      }
      
      updateData.slug=await slugMaker(updateData.name?updateData.name:existingCategory.name);
      
      const category = await CategoryRepository.updateById(id, updateData);
      return category;
    
  }

  async deleteCategory(id) {
   
      const category = await CategoryRepository.deleteById(id);
      return category;
   
  }

}

export default new CategoryService();