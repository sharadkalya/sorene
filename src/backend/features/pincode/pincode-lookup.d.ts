declare module 'india-pincode-lookup' {
  export interface PincodeOffice {
    officeName: string;
    pincode: number;
    taluk: string;
    districtName: string;
    stateName: string;
  }

  export function lookup(pincode: string | number): PincodeOffice[];

  const directory: {
    lookup: typeof lookup;
  };

  export default directory;
}
