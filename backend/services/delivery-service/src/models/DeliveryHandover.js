import { DataTypes } from "sequelize";

export default (sequelize) => {
  const DeliveryHandover = sequelize.define(
    "DeliveryHandover",
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
      },
      assignment_id:{
        type:DataTypes.UUID
      },
      order_id: {
        type: DataTypes.BIGINT,
        allowNull:false
      },
      old_delivery_partner_id: {
        type: DataTypes.UUID
      },
      new_delivery_partner_id: {
        type: DataTypes.UUID
      },
      reason: {
        type: DataTypes.TEXT
      },
       handover_latitude:{
        type:DataTypes.DECIMAL(10,8)
       },
        handover_longitude:{
        type:DataTypes.DECIMAL(10,8)
       },
     
      old_partner_confirmed_at : {
        type: DataTypes.DATE
      },
      old_partner_confirmed_at  : {
        type: DataTypes.DATE
      },
      status:{
        type:DataTypes.ENUM("PENDING","OLD_PARTNER_CONFIRMED","COMPLETED","CANCELLED"),
        defaultValue:"PENDING" ,
      }
      

     
    },
    {
      tableName: "delivery_handovers",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false
    }
  );

  DeliveryHandover.associate = (models) => {
    DeliveryHandover.belongsTo(models.DeliveryPartner, {
      foreignKey: "old_delivery_partner_id",
      as: "oldDeliveryPartner"
    });

    DeliveryHandover.belongsTo(models.DeliveryPartner, {
      foreignKey: "new_delivery_partner_id",
      as: "newDeliveryPartner"
    });
  };

  return DeliveryHandover;
};
