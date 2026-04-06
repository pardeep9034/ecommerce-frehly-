import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUserAddresses, createAddress, updateAddress, deleteAddress } from "@/apis/userApi";
import { useSelector } from "react-redux";

const useAddress = () => {
    const queryClient = useQueryClient();
    const user = useSelector((state) => state.auth.user);
    console.log ("user",user)
    
    // GET - fetch addresses
    const { data: addresses, isLoading, error } = useQuery({
        queryKey: ["addresses"],
        queryFn: () => getUserAddresses(user?.id),
        enabled:!!user?.id
    });
    
    // POST - create address
    const createMutation = useMutation({
        mutationFn:(data)=> createAddress(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["addresses"] });
        },
    });
    
    // PUT - update address
    const updateMutation = useMutation({
        mutationFn:({id,data})=> updateAddress(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["addresses"] });
        },
    });
    
    // DELETE - delete address
    const deleteMutation = useMutation({
        mutationFn:(id)=> deleteAddress(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["addresses"] });
        },
    });
    
    return {
        addresses,
        isLoading,
        error,
        createAddress: createMutation,
        updateAddress: updateMutation,
        deleteAddress: deleteMutation,
    };
};

export default useAddress;