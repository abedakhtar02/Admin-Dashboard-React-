// wraps around the fetch that adds authorization headers
//This is a custom fetch function that can be thought of a middleware for the fetch API.
//It adds the authorization header to the request and handles errors from GraphQL responses.
import  {GraphQLFormattedError}  from "graphql"

type Error ={ 
    message: string;
    statusCode: string | number;
}

const customFetch = async (url: string, options: RequestInit)=>{
    const accessToken = localStorage.getItem("access_token");

    const headers = options.headers as Record<string, string>;

    return await fetch(url,{
        ...options,
        headers:{
            ...headers,
            Authorization: headers?.Authorization || `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            "Apollo-Require-Preflight": "true"
        }
    })
}
//Custom error handling functions
const getGraphQLError = (body: Record<"errors", GraphQLFormattedError[] | undefined>) : Error | null => {
    if(!body){
        return {
            message: "Unknown error",
            statusCode: 'INTERNAL_SERVER_ERROR',
        }
    }
    if("errors" in body){
        const error = body?.errors;

        const messages = error?.map((error) => error.message)?.join("");
        const code = error?.[0]?.extensions?.code || "INTERNAL_SERVER_ERROR";

        return {
            message: messages || "Unknown error",
            statusCode: code || 500,
        }

    }

    return null;
}

export const fetchWrapper = async (url: string, options: RequestInit) => {
    const response = await customFetch(url, options);

    const responseClone = response.clone();
    const body = await responseClone.json();

    const error = getGraphQLError(body);

    if( error){
        throw error;
    }

    return response;

}