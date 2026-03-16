import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import Button from './ui/Button';

export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("[Runtime Error Catch]:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-[60vh] flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-red-500/20 p-12 rounded-[2.5rem] max-w-lg w-full text-center shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
                        <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-red-500/10">
                            <AlertCircle size={40} className="text-red-400" />
                        </div>

                        <h2 className="text-3xl font-black text-white mb-4 italic">System Halted.</h2>
                        <p className="text-slate-400 mb-10 leading-relaxed font-medium">
                            A runtime interruption occurred. This might be due to a malformed data payload or a script execution failure.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Button
                                variant="primary"
                                onClick={() => window.location.reload()}
                                className="bg-red-600 hover:bg-red-500 shadow-red-600/20"
                                icon={RefreshCw}
                            >
                                Restart Session
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={() => window.location.href = '/'}
                                icon={Home}
                            >
                                Return Base
                            </Button>
                        </div>

                        <div className="mt-12 pt-8 border-t border-white/5">
                            <code className="text-[10px] text-slate-600 font-mono break-all opacity-50">
                                ERROR_ID: {this.state.error?.message || 'UNKNOWN_RUNTIME_EXCEPTION'}
                            </code>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
