import { useLocation, useParams } from "react-router-dom";
import AddPropertyContent from "../Component/AddPropertyContent";

export default function EditProperty() {
  const { propertyId } = useParams();
  const location = useLocation();
  return <AddPropertyContent propertyId={propertyId} initialProperty={location.state?.property || null} />;
}
