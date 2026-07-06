export default async function slugMaker(data){
    if(data){
        const slug=data.trim().toLowerCase().replace(/\s+/g, "-");
        return slug;
    }
    return null;
}
    
