"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";

const Cattracker = () => {
  const [data, setData] = useState([]);
  const [userData, setUserData] = useState({});

  const apiEndpoint = "/api/allsubtopics";

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Make the API call directly
        const response1 = await fetch(apiEndpoint);
        if (!response1.ok) {
          throw new Error("Failed to fetch data");
        }

        const response = await response1.json();
        // Use response.data directly if that's the structure
        setData(response.subjectsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []); // No need to include `apiEndpoint` in dependencies as it's constant
  useEffect(() => {
    const storedUserData = localStorage.getItem("userData");
    if (storedUserData) {
      setUserData(JSON.parse(storedUserData));
    }
  }, []);

  if (!data[0]) {
    return (
      <div className="loader flex justify-center items-center h-screen">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          className="size-6 animate-spin"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
          />
        </svg>{" "}
        <p>Loading...</p>
      </div>
    );
  }
  return (
    <div>
      <div className="overflow-hidden">

        
        <div className="max-w-[85rem] px-4 pt-20 pb-8 sm:px-6 lg:px-8 lg:py-24 mx-auto">
          <div className="relative mx-auto max-w-4xl grid space-y-5 sm:space-y-10">
            <div className="text-center">
              <h1 className="text-3xl text-gray-800 font-bold sm:text-5xl lg:text-6xl lg:leading-tight ">
                Practice Common Admission Test MCQs{" "}
                <span className="text-blue-500">With Tracker</span>
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="max-w-[85rem] px-4 py-10 sm:px-6 lg:px-8 md:py-14 lg:py-8 mx-auto">
          <div className="hidden lg:block sticky top-0 start-0 py-2 bg-white/60 backdrop-blur-md ">
            <div className="grid grid-cols-6 gap-6">
              <div className="col-span-2">
                <span className="font-semibold text-lg text-gray-800 ">
                  Topics List
                </span>
              </div>

              <div className="col-span-1">
                <p className="flex space-x-2">
                  <span className="font-semibold text-lg text-gray-800 ">
                    Total
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="size-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z"
                    />
                  </svg>
                </p>
                <p className="mt-2 text-sm text-gray-500 dark:text-neutral-500">
                  Total Questions
                </p>
              </div>

              <div className="col-span-1">
                <p className="flex space-x-2">
                  <span className="font-semibold text-lg text-gray-800 ">
                    Attempted
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="size-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                    />
                  </svg>
                </p>
                <p className="mt-2 text-sm text-gray-500 dark:text-neutral-500">
                  Attempted By You
                </p>
              </div>

              <div className="col-span-1">
                <p className="flex space-x-2">
                  <span className="font-semibold text-lg text-gray-800 ">
                    Not Attempted
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="size-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                    />
                  </svg>
                </p>
                <p className="mt-2 text-sm text-gray-500 dark:text-neutral-500">
                  Not Attempted By You
                </p>
              </div>

              <div className="col-span-1">
                <p className="flex space-x-2">
                  <span className="font-semibold text-lg text-gray-800 ">
                    Progress
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="size-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
                    />
                  </svg>
                </p>
                <p className="mt-2 text-sm text-gray-500 dark:text-neutral-500">
                  Your Progress
                </p>
              </div>
            </div>
          </div>
          {data?.map((data, i) => (
            <div key={i} className="space-y-4 lg:space-y-0">
              <ul className="grid lg:grid-cols-6 lg:gap-6">
                <li className="lg:col-span-2 lg:py-3">
                  <span className="text-lg font-semibold text-gray-800 ">
                    {data?.subject?.replace(/-/g, " ").toUpperCase() === "CAT"
                      ? "CAT PYQs"
                      : data?.subject?.replace(/-/g, " ").toUpperCase()}
                  </span>
                </li>

                <li className="hidden lg:block lg:col-span-1 py-1.5 lg:py-3 px-4 lg:px-0 lg:text-center"></li>

                <li className="hidden lg:block lg:col-span-1 py-1.5 lg:py-3 px-4 lg:px-0 lg:text-center"></li>

                <li className="hidden lg:block lg:col-span-1 py-1.5 lg:py-3 px-4 lg:px-0 lg:text-center"></li>

                <li className="hidden lg:block lg:col-span-1 py-1.5 lg:py-3 px-4 lg:px-0 lg:text-center"></li>
              </ul>

              {data.subtopics.map((data, i) => (
                <ul key={i} className="grid lg:grid-cols-6 lg:gap-6">
                  <li className="lg:col-span-2 pb-1.5 lg:py-3">
                    <a href={`/practice/${data?.title}`} className="flex">
                      <span className="font-semibold lg:font-normal text-sm text-gray-800 ">
                        {data?.title.replace(/-/g, " ")}
                      </span>
                      <span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="1.5"
                          stroke="currentColor"
                          className="size-4"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                          />
                        </svg>
                      </span>
                    </a>
                  </li>

                  <li className="col-span-1 py-1.5 lg:py-3 border-b border-gray-200 ">
                    <div className="grid grid-cols-2 md:grid-cols-6 lg:block">
                      <span className="lg:hidden md:col-span-2 text-sm text-gray-800 ">
                        <p className="flex space-x-2">
                          <span className="font-semibold text-xs text-gray-800 ">
                            Total Questions
                          </span>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="1.5"
                            stroke="currentColor"
                            className="size-4"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z"
                            />
                          </svg>
                        </p>
                      </span>
                      <span className="text-sm text-gray-800 ">
                        {data?.count} in Total
                      </span>
                    </div>
                  </li>

                  <li className="col-span-1 py-1.5 lg:py-3 border-b border-gray-200 ">
                    <div className="grid grid-cols-2 md:grid-cols-6 lg:block">
                      <span className="lg:hidden md:col-span-2 text-sm text-gray-800 ">
                        Attempted
                      </span>
                      <span className="text-sm text-gray-800 ">
                        {userData[data?.title]?.completedQuestions.length !=
                        null
                          ? Math.round(
                              userData[data?.title]?.completedQuestions.length
                            )
                          : "0"}
                        {" completed"}
                      </span>
                    </div>
                  </li>

                  <li className="col-span-1 py-1.5 lg:py-3 border-b border-gray-200 ">
                    <div className="grid grid-cols-2 md:grid-cols-6 lg:block">
                      <span className="lg:hidden md:col-span-2 text-sm text-gray-800 ">
                        Not Attempted
                      </span>
                      <span className="text-sm text-gray-800 ">
                        {userData[data?.title]?.completedQuestions.length !=
                        null
                          ? data.totalQuestions -
                            userData[data?.title]?.completedQuestions.length
                          : "0"}
                        {" not completed"}
                      </span>
                    </div>
                  </li>

                  <li className="col-span-1 py-1.5 lg:py-3 border-b border-gray-200 ">
                    <div className="grid grid-cols-2 md:grid-cols-6 lg:block">
                      <span className="lg:hidden md:col-span-2 text-sm text-gray-800 ">
                        Progress
                      </span>
                      <span className="py-[5px] px-1.5 inline-flex items-center gap-x-1 text-xs font-medium rounded-md bg-teal-100 text-teal-800  ">
                        <svg
                          className="inline-block size-3.5"
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M12 5v14" />
                          <path d="m19 12-7 7-7-7" />
                        </svg>
                        {userData[data?.title]?.completedQuestions.length !=
                        null
                          ? Math.round(
                              (userData[data?.title]?.completedQuestions
                                .length /
                                data.totalQuestions) *
                                100
                            )
                          : "0"}{" "}
                        % Module Completed{" "}
                      </span>{" "}
                    </div>
                  </li>
                </ul>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Cattracker;
