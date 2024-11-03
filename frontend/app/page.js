'use client'
import { Link } from "@nextui-org/link";
import { Snippet } from "@nextui-org/snippet";
import { Code } from "@nextui-org/code";
import { button as buttonStyles } from "@nextui-org/theme";

import { motion } from "framer-motion";

import { useEffect, useState } from 'react';

import { siteConfig } from "@/config/site";
import { title, subtitle } from "@/components/primitives";
import { GithubIcon } from "@/components/icons";


export default function Home() {

  // Add before return statement
  const [locationState, setLocationState] = useState({
    latitude: null,
    longitude: null
  });

  const [orientationState, setOrientationState] = useState({
    alpha: null,
    beta: null,
    gamma: null
  });

  const [locationPermission, setLocationPermission] = useState('prompt');
  const [orientationPermission, setOrientationPermission] = useState('prompt');

  const [locationRejected, setLocationRejected] = useState(false);
  const [orientationRejected, setOrientationRejected] = useState(false);

  const [orientationSupported, setOrientationSupported] = useState(false);


  useEffect(() => {

    const isOrientationSupported = Boolean(
      window && window.DeviceOrientationEvent &&
      typeof window.DeviceOrientationEvent === 'function'
    );

    setOrientationSupported(isOrientationSupported);

    if (!isOrientationSupported) {
      setOrientationState(prev => ({
        ...prev,
        error: "Device orientation not supported on this device"
      }));
      return;
    }


    // Update permission checks in useEffect
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' })
        .then(result => {
          setLocationPermission(result.state);
          setLocationRejected(result.state === 'denied');
          result.onchange = () => {
            setLocationPermission(result.state);
            setLocationRejected(result.state === 'denied');
          }
        });
    }

    if (typeof (DeviceOrientationEvent).requestPermission === 'function') {
      (DeviceOrientationEvent).requestPermission()
        .then((response) => {
          setOrientationPermission(response);
          setOrientationRejected(response === 'denied');
        }).catch(() => {
          setOrientationRejected(true);
        });
    }

    // Request location permission
    if ('geolocation' in navigator) {
      navigator.geolocation.watchPosition(
        (position) => {
          setLocationState({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          setLocationState(prev => ({ ...prev, error: error.message }));
        }
      );
    }

    // Request device orientation permission
    if ('DeviceOrientationEvent' in window) {
      // Request permission for iOS devices
      if (typeof (DeviceOrientationEvent).requestPermission === 'function') {
        (DeviceOrientationEvent).requestPermission()
          .then((response) => {
            if (response === 'granted') {
              addOrientationListener();
            }
          })
          .catch((error) => {
            setOrientationState(prev => ({ ...prev, error: error.message }));
          });
      } else {
        // Add listener directly for non-iOS devices
        addOrientationListener();
      }
    }

    function addOrientationListener() {
      window.addEventListener('deviceorientation', (event) => {
        setOrientationState({
          alpha: event.alpha,
          beta: event.beta,
          gamma: event.gamma
        });
      });
    }

    return () => {
      window.removeEventListener('deviceorientation', () => { });
    };
  }, []);


  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="inline-block max-w-xl text-center justify-center">
        <span className={title()}>Hide &nbsp;</span>
        <span className={title({ color: "blue" })}>AND&nbsp;</span>
        <br />
        <span className={title()}>
          seek physically &nbsp;
        </span>
        <br />
        <span className={title({ color: "yellow" })}>BUT&nbsp;</span>
        <span className={title()}>digitally too</span>

        <div className={subtitle({ class: "mt-4" })}>
          "Best Game Ever" - Mason L
        </div>
      </div>

      <div className="flex gap-3">
        <Link
          isExternal
          className={buttonStyles({
            color: "primary",
            radius: "full",
            variant: "shadow",
            size: "large"
          })}
          href={siteConfig.links.docs}
        >
          Start
        </Link>
      </div>

      <div className="mb-4">
        <Snippet hideSymbol variant="flat">
          <span>
            Orientation Support: {orientationSupported ?
              <span className="text-success">Supported</span> :
              <span className="text-danger">Not Supported</span>
            }
          </span>
        </Snippet>
      </div>

      {locationState.error ? (
        <div className="text-danger">
          You have denied the location permission. Location permission is required to use this app. Please enable it in your device settings.
        </div>
      ) :
        (
          <div className="max-w-md p-6 mb-8 border-2 border-divider rounded-lg">
            <h3 className={subtitle()}>Permissions Required</h3>
            <p className="mb-4 text-default-600">
              This app needs access to your location and device orientation to enable the hide-and-street experience.
              Your data is only used locally and never stored.
            </p>
            <motion.button
              className={buttonStyles({ color: "primary", size: "lg", variant: "shadow" })}
              animate={{
                boxShadow: [
                  "0 0 15px rgba(0, 112, 243, 0.5)",
                  "0 0 30px rgba(0, 112, 243, 0.8)",
                  "0 0 15px rgba(0, 112, 243, 0.5)"
                ]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}

              onClick={async () => {
                // Request Location
                if ('geolocation' in navigator) {
                  try {
                    await new Promise((resolve, reject) => {
                      navigator.geolocation.getCurrentPosition(resolve, reject);
                    });
                    setLocationPermission('granted');
                  } catch (error) {
                    setLocationRejected(true);
                  }
                }

                // Request Orientation
                if ('DeviceOrientationEvent' in window &&
                  typeof DeviceOrientationEvent.requestPermission === 'function') {
                  try {
                    const response = await DeviceOrientationEvent.requestPermission();
                    setOrientationPermission(response);
                    if (response === 'denied') setOrientationRejected(true);
                  } catch (error) {
                    setOrientationRejected(true);
                  }
                }
              }}
            >
              Enable Features
            </motion.button>
          </div>

        )}
      {/* Add location and orientation data */}
      <div className="mb-8">
        {(
          <Snippet hideSymbol variant="bordered">
            <span>
              Location: {locationState.latitude?.toFixed(4)}, {locationState.longitude?.toFixed(4)}
            </span>
          </Snippet>
        )}

        {orientationState.error ? (
          <div className="text-danger">Orientation Error: {orientationState.error}</div>
        ) : (
          <Snippet hideSymbol variant="bordered">
            <span>
              Orientation: α:{orientationState.alpha?.toFixed(1)}° β:{orientationState.beta?.toFixed(1)}° γ:{orientationState.gamma?.toFixed(1)}°
            </span>
          </Snippet>
        )}
      </div>

      <div className="mt-8">
        <Snippet hideCopyButton hideSymbol variant="bordered">
          <span>
            Get started by editing <Code color="primary">app/page.tsx</Code>
          </span>
        </Snippet>
      </div>

      <div className="flex gap-4 mb-4">
        <Snippet hideSymbol variant="flat">
          <span>
            Location Permission:
            <span className={locationPermission === 'granted' ? 'text-success' : 'text-danger'}>
              {locationPermission}
            </span>
          </span>
        </Snippet>
        <Snippet hideSymbol variant="flat">
          <span>
            Orientation Permission:
            <span className={orientationPermission === 'granted' ? 'text-success' : 'text-danger'}>
              {orientationPermission}
            </span>
          </span>
        </Snippet>
      </div>
    </section>
  );
}
