import React from 'react';
import {LoaderCircle} from 'lucide-react';
export default function Loading({label='Chargement…',className=''}) {
 return <div className={'loading-indicator '+className} role="status" aria-live="polite"><LoaderCircle className="spinner" size={20} aria-hidden="true"/><span>{label}</span></div>;
}
