//package com.example.moneyexpensestracker.adapter;
//
//import android.provider.ContactsContract;
//
//import androidx.annotation.NonNull;
//import androidx.fragment.app.Fragment;
//import androidx.fragment.app.FragmentActivity;
//import androidx.viewpager2.adapter.FragmentStateAdapter;
//
//import com.example.moneyexpensestracker.MainActivity;
//import com.example.moneyexpensestracker.ui.home.HomeFragment;
//
//public class FragmentAdapter extends FragmentStateAdapter {
//    public ViewpagerAdapter(@NonNull FragmentActivity fragmentActivity) {
//        super(fragmentActivity);
//    }
//
//    @NonNull
//    @Override
//    public Fragment createFragment(int position) {
//        switch(position)
//        {
//            case 0:
//                return new HomeFragment();
//            case 1:
//                return new MainActivity();
//            case 2:
//                return new Expenditure();
//            case 3:
//                return new Statistics();
//            case 4:
//                return new Profile();
//            default:
//                return new Home();
//        }
//    }
//
//    @Override
//    public int getItemCount() {
//        return 0;
//    }
//}
