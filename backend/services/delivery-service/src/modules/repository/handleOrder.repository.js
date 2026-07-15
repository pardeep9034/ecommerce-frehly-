import BaseRepository from "./baseRepository.js";

class HandleOrderRepository extends BaseRepository {
  constructor() {
    super("DeliveryAssignment");
  }
}

export default new HandleOrderRepository();
