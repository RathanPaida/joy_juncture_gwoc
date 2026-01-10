// app/api/debug/order-schema/route.ts
// USE THIS TO SEE YOUR ORDER MODEL'S REQUIRED FIELDS
import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/mongodb";
import { Order } from "@/models/Order";

export async function GET(request: NextRequest) {
  try {
    await connectDb();

    // Get the Order model schema
    const schema = Order.schema;
    const paths = schema.paths;

    const requiredFields: string[] = [];
    const optionalFields: string[] = [];
    const allFields: any = {};

    Object.keys(paths).forEach((key) => {
      const path = paths[key];

      allFields[key] = {
        type: path.instance,
        required: path.isRequired || false,
        default: path.defaultValue,
      };

      if (path.isRequired) {
        requiredFields.push(key);
      } else {
        optionalFields.push(key);
      }
    });

    return NextResponse.json({
      requiredFields,
      optionalFields,
      allFields,
      modelName: Order.modelName,
      collectionName: Order.collection.name,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
