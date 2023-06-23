function Error({ title, body }) {
  return (
    <div className="flex flex-col justify-center items-center h-full">
      <h1 className="text-4xl mb-4">{title || "Something went wrong"}</h1>
      <p className="text-lg">
        {body || "An error occurred while trying to process your request."}
      </p>
    </div>
  );
}

export default Error;
